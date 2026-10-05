export const CLIENT_TO_SERVER_EVENTS = {
    CONVERSATION_JOIN: "conversation:join",
    CONVERSATION_LEAVE: "conversation:leave",
    MESSAGE_SEND: "message:send",
    TYPING_START: "typing:start",
    TYPING_STOP: "typing:stop",
    MESSAGE_DELIVERED: "message:delivered",
    CONVERSATION_READ: "conversation:read",
} as const;

export const SERVER_TO_CLIENT_EVENTS = {
    MESSAGE_NEW: "message:new",
    TYPING_UPDATE: "typing:update",
    PRESENCE_UPDATE: "presence:update",
    MESSAGE_RECEIPT: "message:receipt",
    SERVER_ERROR: "server:error",
} as const;

export type ClientToServerEventName =
    (typeof CLIENT_TO_SERVER_EVENTS)[keyof typeof CLIENT_TO_SERVER_EVENTS];

export type ServerToClientEventName =
    (typeof SERVER_TO_CLIENT_EVENTS)[keyof typeof SERVER_TO_CLIENT_EVENTS];