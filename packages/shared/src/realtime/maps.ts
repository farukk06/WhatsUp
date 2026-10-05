import type {
    ConversationJoinAck,
    ConversationJoinPayload,
    ConversationLeaveAck,
    ConversationLeavePayload,
} from "./conversation";

import type {
    ConversationReadPayload,
    MessageDeliveredPayload,
    MessageReceiptPayload,
} from "./receipt";

import type {
    MessageNewPayload,
    MessageSendAck,
    MessageSendPayload,
} from "./message";

import type {
    TypingStartPayload,
    TypingStopPayload,
    TypingUpdatePayload,
} from "./typing";

import type { PresenceUpdatePayload } from "./presence";
import type { ServerErrorPayload } from "./error";

export interface ClientToServerEvents {
    "conversation:join": (
        payload: ConversationJoinPayload,
        ack: (response: ConversationJoinAck) => void,
    ) => void;

    "conversation:leave": (
        payload: ConversationLeavePayload,
        ack: (response: ConversationLeaveAck) => void,
    ) => void;

    "message:send": (
        payload: MessageSendPayload,
        ack: (response: MessageSendAck) => void,
    ) => void;

    "typing:start": (payload: TypingStartPayload) => void;

    "typing:stop": (payload: TypingStopPayload) => void;

    "message:delivered": (payload: MessageDeliveredPayload) => void;

    "conversation:read": (payload: ConversationReadPayload) => void;
}

export interface ServerToClientEvents {
    "message:new": (payload: MessageNewPayload) => void;

    "typing:update": (payload: TypingUpdatePayload) => void;

    "presence:update": (payload: PresenceUpdatePayload) => void;

    "message:receipt": (payload: MessageReceiptPayload) => void;

    "server:error": (payload: ServerErrorPayload) => void;
}