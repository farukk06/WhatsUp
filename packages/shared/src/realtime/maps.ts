import type {
    ConversationJoinAck,
    ConversationJoinPayload,
    ConversationLeaveAck,
    ConversationLeavePayload,
} from "./conversation.js";

import type {
    ConversationReadPayload,
    MessageDeliveredPayload,
    MessageReceiptPayload,
} from "./receipt.js";

import type {
    MessageNewPayload,
    MessageSendAck,
    MessageSendPayload,
} from "./message.js";

import type {
    TypingStartPayload,
    TypingStopPayload,
    TypingUpdatePayload,
} from "./typing.js";

import type { PresenceUpdatePayload } from "./presence.js";
import type { ServerErrorPayload } from "./error.js";

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