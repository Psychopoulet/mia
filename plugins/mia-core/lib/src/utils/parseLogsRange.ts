// types & interfaces

export interface iLogsRange {
    "from": Date;
    "to": Date;
}

// module

function _parseDate (value: unknown, name: string): Date {

    if ("string" !== typeof value || "" === value.trim()) {
        throw new RangeError("Missing \"" + name + "\" query parameter");
    }

    const parsed: Date = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        throw new RangeError("Invalid \"" + name + "\" date-time : \"" + value + "\"");
    }

    return parsed;

}

/**
 * Extract the `from` / `to` date-time range from a request query.
 * Throws a RangeError on a missing, unparsable or inverted range.
 */
export default function parseLogsRange (query: Record<string, unknown> | undefined): iLogsRange {

    const from: Date = _parseDate(query?.from, "from");
    const to: Date = _parseDate(query?.to, "to");

    if (from.getTime() > to.getTime()) {
        throw new RangeError("\"from\" must be anterior or equal to \"to\"");
    }

    return {
        from,
        to
    };

}
