// consts

export const LOGS_HARD_LIMIT: number = 10000;

// private

function _parseInteger (value: unknown, name: string): number {

    if ("number" === typeof value) {

        if (!Number.isInteger(value)) {
            throw new RangeError("Invalid \"" + name + "\" query parameter : \"" + String(value) + "\"");
        }

        return value;

    }

    if ("string" !== typeof value) {
        throw new RangeError("Invalid \"" + name + "\" query parameter : \"" + String(value) + "\"");
    }

    const trimmed: string = value.trim();

    if (!/^-?\d+$/u.test(trimmed)) {
        throw new RangeError("Invalid \"" + name + "\" query parameter : \"" + value + "\"");
    }

    return Number.parseInt(trimmed, 10);

}

// module

/**
 * Read the optional `limit` query parameter and clamp it to `LOGS_HARD_LIMIT`.
 * Absent or empty values use the hard cap. Non-integers and values below 1 throw.
 */
export default function parseLogsLimit (query: Record<string, unknown> | undefined): number {

    const raw: unknown = query?.limit;

    if ("undefined" === typeof raw || null === raw || "" === raw) {
        return LOGS_HARD_LIMIT;
    }

    if ("string" === typeof raw && "" === raw.trim()) {
        return LOGS_HARD_LIMIT;
    }

    const parsed: number = _parseInteger(raw, "limit");

    if (1 > parsed) {
        throw new RangeError("\"limit\" must be an integer greater than or equal to 1");
    }

    return Math.min(parsed, LOGS_HARD_LIMIT);

}
