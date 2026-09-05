// deps

    // natives
    const { join } = require("node:path");
    const { mkdtemp, readFile } = require("node:fs/promises");
    const { tmpdir } = require("node:os");
    const { strictEqual, deepStrictEqual, rejects } = require("node:assert");

    // externals
    const { UnauthorizedError } = require("node-pluginsmanager-plugin");

    // locals
    const {
        installStubs,
        resetStubs,
        restoreStubs,
        stubs,
        createContainer
    } = require("./helpers/mediatorHarness");
    const { authHeaders } = require("./helpers/authStoreHarness");

    installStubs();

    const Mediator = require("../lib/cjs/Mediator.js").default;

// consts

    const DESCRIPTOR_FILE = join(__dirname, "..", "lib", "data", "Descriptor.json");
    const MAX_TIMEOUT = 10000;

    const FROM = "2024-03-01T00:00:00.000Z";
    const TO = "2024-03-02T00:00:00.000Z";

    const ADMIN_CALLER = {
        "name": "admin",
        "isAdmin": true,
        "token": "tok-admin"
    };

    const USER_CALLER = {
        "name": "alice",
        "isAdmin": false,
        "token": "tok-alice"
    };

    const LOG_ROWS = [
        {
            "id": 1,
            "level": "info",
            "message": "server started",
            "timestamp": new Date("2024-03-01T10:00:00.000Z"),
            "meta": null
        },
        {
            "id": 2,
            "level": "error",
            "message": "boom",
            "timestamp": new Date("2024-03-01T11:30:00.000Z"),
            "meta": {
                "code": 500
            }
        }
    ];

// tests

describe("Mediator logs", () => {

    let descriptor = null;
    let resourcesDir = "";
    let mediator = null;
    let findCalls = [];
    let destroyCalls = [];

    before(async () => {

        descriptor = JSON.parse(await readFile(DESCRIPTOR_FILE, "utf-8"));
        resourcesDir = await mkdtemp(join(tmpdir(), "mia-core-logs-"));

    });

    beforeEach(async () => {

        resetStubs();

        findCalls = [];
        destroyCalls = [];

        stubs.tokenGetUserByToken = () => {
            return Promise.resolve(ADMIN_CALLER);
        };

        stubs.logFindInRange = (from, to, level) => {

            findCalls.push({
                "from": from,
                "to": to,
                "level": level
            });

            return Promise.resolve([]);

        };

        stubs.logDestroyInRange = (from, to) => {

            destroyCalls.push({
                "from": from,
                "to": to
            });

            return Promise.resolve(destroyCalls.length);

        };

        mediator = new Mediator({
            "descriptor": descriptor,
            "externalResourcesDirectory": resourcesDir
        });

        await mediator._initWorkSpace(createContainer());

    });

    afterEach(async () => {

        const instance = mediator;
        mediator = null;

        if (null !== instance) {
            await instance._releaseWorkSpace();
        }

    });

    after(() => {
        restoreStubs();
    });

    describe("getLogs", () => {

        it("should format one plain-text line per record, in timestamp order", async () => {

            stubs.logFindInRange = () => {
                return Promise.resolve(LOG_ROWS);
            };

            const content = await mediator.getLogs({
                ...authHeaders("tok-admin"),
                "query": {
                    "from": FROM,
                    "to": TO
                }
            });

            strictEqual(typeof content, "string");

            const lines = content.split("\n");

            strictEqual(lines.length, 2);
            strictEqual(lines[0], "2024-03-01T10:00:00.000Z [INFO] server started");
            strictEqual(lines[1], "2024-03-01T11:30:00.000Z [ERROR] boom {\"code\":500}");

        }).timeout(MAX_TIMEOUT);

        it("should forward the parsed range and the level filter", async () => {

            await mediator.getLogs({
                ...authHeaders("tok-admin"),
                "query": {
                    "from": FROM,
                    "to": TO,
                    "level": "warning"
                }
            });

            strictEqual(findCalls.length, 1);
            strictEqual(findCalls[0].from instanceof Date, true);
            strictEqual(findCalls[0].to instanceof Date, true);
            strictEqual(findCalls[0].from.toISOString(), FROM);
            strictEqual(findCalls[0].to.toISOString(), TO);
            strictEqual(findCalls[0].level, "warning");

        }).timeout(MAX_TIMEOUT);

        it("should forward an undefined level when the filter is absent", async () => {

            await mediator.getLogs({
                ...authHeaders("tok-admin"),
                "query": {
                    "from": FROM,
                    "to": TO
                }
            });

            strictEqual(findCalls.length, 1);
            strictEqual(typeof findCalls[0].level, "undefined");

        }).timeout(MAX_TIMEOUT);

        it("should resolve an empty string when there is no record", async () => {

            const content = await mediator.getLogs({
                ...authHeaders("tok-admin"),
                "query": {
                    "from": FROM,
                    "to": TO
                }
            });

            strictEqual(content, "");

        }).timeout(MAX_TIMEOUT);

        it("should reject RangeError when the query is missing", async () => {

            await rejects(() => {
                return mediator.getLogs(authHeaders("tok-admin"));
            }, RangeError);

            strictEqual(findCalls.length, 0);

        }).timeout(MAX_TIMEOUT);

        it("should reject RangeError when \"from\" is missing", async () => {

            await rejects(() => {
                return mediator.getLogs({
                    ...authHeaders("tok-admin"),
                    "query": {
                        "to": TO
                    }
                });
            }, RangeError);

            strictEqual(findCalls.length, 0);

        }).timeout(MAX_TIMEOUT);

        it("should reject RangeError when \"to\" is missing", async () => {

            await rejects(() => {
                return mediator.getLogs({
                    ...authHeaders("tok-admin"),
                    "query": {
                        "from": FROM
                    }
                });
            }, RangeError);

            strictEqual(findCalls.length, 0);

        }).timeout(MAX_TIMEOUT);

        it("should reject RangeError on an unparsable date-time", async () => {

            await rejects(() => {
                return mediator.getLogs({
                    ...authHeaders("tok-admin"),
                    "query": {
                        "from": "not-a-date",
                        "to": TO
                    }
                });
            }, RangeError);

            strictEqual(findCalls.length, 0);

        }).timeout(MAX_TIMEOUT);

        it("should reject RangeError on an inverted range", async () => {

            await rejects(() => {
                return mediator.getLogs({
                    ...authHeaders("tok-admin"),
                    "query": {
                        "from": TO,
                        "to": FROM
                    }
                });
            }, RangeError);

            strictEqual(findCalls.length, 0);

        }).timeout(MAX_TIMEOUT);

        it("should allow a non-admin signed-in caller to read logs", async () => {

            stubs.tokenGetUserByToken = () => {
                return Promise.resolve(USER_CALLER);
            };

            const content = await mediator.getLogs({
                ...authHeaders("tok-alice"),
                "query": {
                    "from": FROM,
                    "to": TO
                }
            });

            strictEqual(content, "");
            strictEqual(findCalls.length, 1);

        }).timeout(MAX_TIMEOUT);

    });

    describe("deleteLogs", () => {

        it("should purge the parsed range for an admin caller", async () => {

            const purged = await mediator.deleteLogs({
                ...authHeaders("tok-admin"),
                "query": {
                    "from": FROM,
                    "to": TO
                }
            });

            strictEqual(typeof purged, "undefined");
            strictEqual(destroyCalls.length, 1);
            strictEqual(destroyCalls[0].from instanceof Date, true);
            strictEqual(destroyCalls[0].to instanceof Date, true);

            deepStrictEqual([ destroyCalls[0].from.toISOString(), destroyCalls[0].to.toISOString() ], [ FROM, TO ]);

        }).timeout(MAX_TIMEOUT);

        it("should reject UnauthorizedError for a non-admin caller", async () => {

            stubs.tokenGetUserByToken = () => {
                return Promise.resolve(USER_CALLER);
            };

            await rejects(() => {
                return mediator.deleteLogs({
                    ...authHeaders("tok-alice"),
                    "query": {
                        "from": FROM,
                        "to": TO
                    }
                });
            }, UnauthorizedError);

            strictEqual(destroyCalls.length, 0);

        }).timeout(MAX_TIMEOUT);

        it("should reject RangeError on a missing range and purge nothing", async () => {

            await rejects(() => {
                return mediator.deleteLogs(authHeaders("tok-admin"));
            }, RangeError);

            strictEqual(destroyCalls.length, 0);

        }).timeout(MAX_TIMEOUT);

        it("should reject RangeError on an invalid range and purge nothing", async () => {

            await rejects(() => {
                return mediator.deleteLogs({
                    ...authHeaders("tok-admin"),
                    "query": {
                        "from": FROM,
                        "to": "not-a-date"
                    }
                });
            }, RangeError);

            strictEqual(destroyCalls.length, 0);

        }).timeout(MAX_TIMEOUT);

    });

});
