export const REALTIME_SCHEMA_VERSION = 1 as const;

export type RealtimeSchemaVersion = typeof REALTIME_SCHEMA_VERSION;

export type AckSuccess<T> = {
    ok: true;
    data: T;
};

export type RealtimeErrorCode =
    | "INVALID_PAYLOAD"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "CONFLICT"
    | "RATE_LIMITED"
    | "INTERNAL_ERROR";

export type AckError = {
    ok: false;
    error: {
        code: RealtimeErrorCode;
        message: string;
    };
};

export type SocketAck<T> = AckSuccess<T> | AckError;