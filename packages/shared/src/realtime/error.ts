import type {
    RealtimeErrorCode,
    RealtimeSchemaVersion,
} from "./common";

export type ServerErrorPayload = {
    schemaVersion: RealtimeSchemaVersion;
    error: {
        code: RealtimeErrorCode;
        message: string;
    };
};