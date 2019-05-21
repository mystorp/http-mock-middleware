import { Server } from "http";

interface MockOptions {
    server?: Server,
    websocket?: {
        encodeMessage(msg: Buffer): string;
        decodeMessage(json: any): any;
    }
}