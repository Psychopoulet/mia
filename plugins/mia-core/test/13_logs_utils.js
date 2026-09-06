// deps

    // natives
    const { strictEqual, throws } = require("node:assert");

    // locals
    const formatLogLine = require("../lib/cjs/utils/formatLogLine.js").default;
    const parseLogsLimit = require("../lib/cjs/utils/parseLogsLimit.js").default;
    const { LOGS_HARD_LIMIT } = require("../lib/cjs/utils/parseLogsLimit.js");
    const parseLogsRange = require("../lib/cjs/utils/parseLogsRange.js").default;

// consts

    const FROM = "2024-03-01T00:00:00.000Z";
    const TO = "2024-03-02T00:00:00.000Z";
    const MAX_TIMEOUT = 10000;

// tests

describe("logs utils", () => {

    describe("formatLogLine", () => {

        it("should format a record without meta", () => {

            strictEqual(formatLogLine({
                "id": 1,
                "level": "info",
                "message": "server started",
                "timestamp": new Date("2024-03-01T10:00:00.000Z"),
                "meta": null
            }), "2024-03-01T10:00:00.000Z [INFO] server started");

        }).timeout(MAX_TIMEOUT);

        it("should append the stringified meta when it is set", () => {

            strictEqual(formatLogLine({
                "id": 2,
                "level": "error",
                "message": "boom",
                "timestamp": new Date("2024-03-01T11:30:00.000Z"),
                "meta": {
                    "code": 500,
                    "route": "/mia-core/api/logs"
                }
            }), "2024-03-01T11:30:00.000Z [ERROR] boom {\"code\":500,\"route\":\"/mia-core/api/logs\"}");

        }).timeout(MAX_TIMEOUT);

        it("should collapse line breaks so one record stays one line", () => {

            const line = formatLogLine({
                "id": 3,
                "level": "critical",
                "message": "stack:\r\n  at first\n\n  at second",
                "timestamp": new Date("2024-03-01T12:00:00.000Z"),
                "meta": null
            });

            strictEqual(line.includes("\n"), false);
            strictEqual(line.includes("\r"), false);
            strictEqual(line, "2024-03-01T12:00:00.000Z [CRITICAL] stack:   at first   at second");

        }).timeout(MAX_TIMEOUT);

        it("should accept a timestamp given as a string", () => {

            strictEqual(formatLogLine({
                "id": 4,
                "level": "debug",
                "message": "raw row",
                "timestamp": "2024-03-01T13:00:00.000Z",
                "meta": null
            }), "2024-03-01T13:00:00.000Z [DEBUG] raw row");

        }).timeout(MAX_TIMEOUT);

        it("should omit meta when it is undefined", () => {

            const record = {
                "id": 5,
                "level": "warning",
                "message": "missing meta",
                "timestamp": new Date("2024-03-01T14:00:00.000Z")
            };

            strictEqual("undefined" === typeof record.meta, true);

            const line = formatLogLine(record);

            strictEqual(line.includes("undefined"), false);
            strictEqual(line, "2024-03-01T14:00:00.000Z [WARNING] missing meta");

        }).timeout(MAX_TIMEOUT);

    });

    describe("parseLogsRange", () => {

        it("should parse a valid range", () => {

            const range = parseLogsRange({
                "from": FROM,
                "to": TO
            });

            strictEqual(range.from instanceof Date, true);
            strictEqual(range.to instanceof Date, true);
            strictEqual(range.from.toISOString(), FROM);
            strictEqual(range.to.toISOString(), TO);

        }).timeout(MAX_TIMEOUT);

        it("should accept a range where both bounds are equal", () => {

            const range = parseLogsRange({
                "from": FROM,
                "to": FROM
            });

            strictEqual(range.from.getTime(), range.to.getTime());

        }).timeout(MAX_TIMEOUT);

        it("should throw RangeError when the query is missing", () => {

            throws(() => {
                return parseLogsRange();
            }, RangeError);

        }).timeout(MAX_TIMEOUT);

        it("should throw RangeError when \"from\" is missing", () => {

            throws(() => {
                return parseLogsRange({
                    "to": TO
                });
            }, RangeError);

        }).timeout(MAX_TIMEOUT);

        it("should throw RangeError when \"to\" is missing", () => {

            throws(() => {
                return parseLogsRange({
                    "from": FROM
                });
            }, RangeError);

        }).timeout(MAX_TIMEOUT);

        it("should throw RangeError on a blank value", () => {

            throws(() => {
                return parseLogsRange({
                    "from": "   ",
                    "to": TO
                });
            }, RangeError);

        }).timeout(MAX_TIMEOUT);

        it("should throw RangeError on a non-string value", () => {

            throws(() => {
                return parseLogsRange({
                    "from": 1709251200000,
                    "to": TO
                });
            }, RangeError);

        }).timeout(MAX_TIMEOUT);

        it("should throw RangeError on an unparsable \"from\"", () => {

            throws(() => {
                return parseLogsRange({
                    "from": "not-a-date",
                    "to": TO
                });
            }, RangeError);

        }).timeout(MAX_TIMEOUT);

        it("should throw RangeError on an unparsable \"to\"", () => {

            throws(() => {
                return parseLogsRange({
                    "from": FROM,
                    "to": "not-a-date"
                });
            }, RangeError);

        }).timeout(MAX_TIMEOUT);

        it("should throw RangeError on an inverted range", () => {

            throws(() => {
                return parseLogsRange({
                    "from": TO,
                    "to": FROM
                });
            }, RangeError);

        }).timeout(MAX_TIMEOUT);

    });

    describe("parseLogsLimit", () => {

        it("should return the hard cap when \"limit\" is absent", () => {

            strictEqual(LOGS_HARD_LIMIT, 10000);
            strictEqual(parseLogsLimit(), LOGS_HARD_LIMIT);
            strictEqual(parseLogsLimit({}), LOGS_HARD_LIMIT);

        }).timeout(MAX_TIMEOUT);

        it("should return the hard cap when \"limit\" is empty", () => {

            strictEqual(parseLogsLimit({
                "limit": ""
            }), LOGS_HARD_LIMIT);

            strictEqual(parseLogsLimit({
                "limit": "   "
            }), LOGS_HARD_LIMIT);

        }).timeout(MAX_TIMEOUT);

        it("should return a valid in-range value as-is", () => {

            strictEqual(parseLogsLimit({
                "limit": 50
            }), 50);

            strictEqual(parseLogsLimit({
                "limit": "50"
            }), 50);

        }).timeout(MAX_TIMEOUT);

        it("should clamp a value above the cap to the hard limit", () => {

            strictEqual(parseLogsLimit({
                "limit": 999999
            }), LOGS_HARD_LIMIT);

        }).timeout(MAX_TIMEOUT);

        it("should throw RangeError when \"limit\" is 0", () => {

            throws(() => {
                return parseLogsLimit({
                    "limit": 0
                });
            }, RangeError);

        }).timeout(MAX_TIMEOUT);

        it("should throw RangeError when \"limit\" is negative", () => {

            throws(() => {
                return parseLogsLimit({
                    "limit": -1
                });
            }, RangeError);

        }).timeout(MAX_TIMEOUT);

        it("should throw RangeError when \"limit\" is not numeric", () => {

            throws(() => {
                return parseLogsLimit({
                    "limit": "not-a-number"
                });
            }, RangeError);

        }).timeout(MAX_TIMEOUT);

        it("should throw RangeError when \"limit\" is a non-integer number", () => {

            throws(() => {
                return parseLogsLimit({
                    "limit": 1.5
                });
            }, RangeError);

        }).timeout(MAX_TIMEOUT);

        it("should throw RangeError when \"limit\" is neither a number nor a string", () => {

            throws(() => {
                return parseLogsLimit({
                    "limit": true
                });
            }, RangeError);

        }).timeout(MAX_TIMEOUT);

    });

});
