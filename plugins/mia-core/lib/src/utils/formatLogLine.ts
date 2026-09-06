// types & interfaces

    // locals
    import type { LogAttributes } from "../types/tools/models/Log";

// module

/**
 * Flatten a log row into a single plain-text line, so one record stays one line
 * even when its message contains line breaks. `meta` is appended only when set.
 */
export default function formatLogLine (log: LogAttributes): string {

    const timestamp: string = new Date(log.timestamp).toISOString();
    const message: string = log.message.replace(/[\r\n]+/gu, " ");
    const line: string = timestamp + " [" + log.level.toUpperCase() + "] " + message;

    return "undefined" === typeof log.meta || null === log.meta ? line : line + " " + JSON.stringify(log.meta);

}
