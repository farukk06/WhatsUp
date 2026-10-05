import type { SocketAck } from "./common";

export type ConversationJoinPayload = {
    conversationId: string;
};

export type ConversationJoinAckData = {
    conversationId: string;
    joined: true;
};

export type ConversationJoinAck = SocketAck<ConversationJoinAckData>;

export type ConversationLeavePayload = {
    conversationId: string;
};

export type ConversationLeaveAckData = {
    conversationId: string;
    left: true;
};

export type ConversationLeaveAck = SocketAck<ConversationLeaveAckData>;