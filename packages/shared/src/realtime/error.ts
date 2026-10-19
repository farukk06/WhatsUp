import type {
    RealtimeErrorCode,
    RealtimeSchemaVersion,
} from "./common.js";

export type ServerErrorPayload = {
    schemaVersion: RealtimeSchemaVersion;
    error: {
        code: RealtimeErrorCode;
        message: string;
    };
};