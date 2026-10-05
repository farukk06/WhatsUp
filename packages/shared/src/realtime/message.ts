import type {
    RealtimeSchemaVersion,
    SocketAck,
} from "./common";

export type MessageType =
    | "TEXT"
    | "IMAGE"
    | "VIDEO"
    | "FILE"
    | "AUDIO";

export type MessageSendPayload = {
    conversationId: string;
    clientMessageId: string;
    type: MessageType;
    body: string | null;
    attachmentIds: string[];
    replyToMessageId: string | null;
};

export type MessageSendAckData = {
    id: string;
    conversationId: string;
    clientMessageId: string;
    seq: number;
    createdAt: string;
};

export type MessageSendAck = SocketAck<MessageSendAckData>;

export type RealtimeMessage = {
    id: string;
    conversationId: string;
    senderId: string;
    clientMessageId: string;
    seq: number;
    type: MessageType;
    body: string | null;
    attachmentIds: string[];
    replyToMessageId: string | null;
    createdAt: string;
};

export type MessageNewPayload = {
    schemaVersion: RealtimeSchemaVersion;
    message: RealtimeMessage;
};