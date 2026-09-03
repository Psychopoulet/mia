// deps

    // natives
    const { join } = require("node:path");
    const { mkdtemp, readFile } = require("node:fs/promises");
    const { tmpdir } = require("node:os");
    const { strictEqual, rejects } = require("node:assert");

    // externals
    const { UnauthorizedError, NotFoundError } = require("node-pluginsmanager-plugin");

    // locals
    const { installStubs, createContainer, useAuthStore } = require("./helpers/mediatorHarness");
    const { createAuthStore, authHeaders } = require("./helpers/authStoreHarness");

    installStubs();

    const Mediator = require("../lib/cjs/Mediator.js").default;

// consts

    const DESCRIPTOR_FILE = join(__dirname, "..", "lib", "data", "Descriptor.json");
    const MAX_TIMEOUT = 10000;

// tests

describe("Mediator tokens", () => {

    let descriptor = null;
    let resourcesDir = "";
    let mediator = null;

    before(async () => {

        descriptor = JSON.parse(await readFile(DESCRIPTOR_FILE, "utf-8"));
        resourcesDir = await mkdtemp(join(tmpdir(), "mia-core-tokens-"));

    });

    beforeEach(async () => {

        const store = createAuthStore();

        store.seedUser("admin", true, "tok-admin");
        store.seedUser("alice", false, "tok-alice");
        store.seedUser("bob", false, "tok-bob");

        useAuthStore(store);

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

    describe("getUserTokens / deleteToken", () => {

        it("should list own tokens", async () => {

            const tokens = await mediator.getUserTokens({
                ...authHeaders("tok-alice"),
                "path": {
                    "name": "alice"
                }
            });

            strictEqual(tokens.length, 1);
            strictEqual(tokens[0].token, "tok-alice");
            strictEqual(typeof tokens[0].createdAt, "string");

        }).timeout(MAX_TIMEOUT);

        it("should allow admin to list another user's tokens", async () => {

            const tokens = await mediator.getUserTokens({
                ...authHeaders("tok-admin"),
                "path": {
                    "name": "alice"
                }
            });

            strictEqual(tokens.length, 1);

        }).timeout(MAX_TIMEOUT);

        it("should forbid listing another user's tokens when not admin", async () => {

            await rejects(() => {
                return mediator.getUserTokens({
                    ...authHeaders("tok-alice"),
                    "path": {
                        "name": "bob"
                    }
                });
            }, UnauthorizedError);

        }).timeout(MAX_TIMEOUT);

        it("should fail when listing tokens of a missing user", async () => {

            await rejects(() => {
                return mediator.getUserTokens({
                    ...authHeaders("tok-admin"),
                    "path": {
                        "name": "ghost"
                    }
                });
            }, NotFoundError);

        }).timeout(MAX_TIMEOUT);

        it("should allow owner to delete own token", async () => {

            await mediator.deleteToken(authHeaders("tok-alice"), {
                "token": "tok-alice"
            });

            const tokens = await mediator.getUserTokens({
                ...authHeaders("tok-admin"),
                "path": {
                    "name": "alice"
                }
            });

            strictEqual(tokens.length, 0);

        }).timeout(MAX_TIMEOUT);

        it("should allow admin to delete another user's token", async () => {

            await mediator.deleteToken(authHeaders("tok-admin"), {
                "token": "tok-bob"
            });

            const tokens = await mediator.getUserTokens({
                ...authHeaders("tok-admin"),
                "path": {
                    "name": "bob"
                }
            });

            strictEqual(tokens.length, 0);

        }).timeout(MAX_TIMEOUT);

        it("should forbid deleting another user's token when not admin", async () => {

            await rejects(() => {
                return mediator.deleteToken(authHeaders("tok-alice"), {
                    "token": "tok-bob"
                });
            }, UnauthorizedError);

        }).timeout(MAX_TIMEOUT);

        it("should fail when token is missing", async () => {

            await rejects(() => {
                return mediator.deleteToken(authHeaders("tok-admin"), {
                    "token": "unknown"
                });
            }, NotFoundError);

        }).timeout(MAX_TIMEOUT);

    });

    describe("authorization errors", () => {

        it("should reject missing authorization on protected ops", async () => {

            let failed = false;

            try {
                await mediator.createUser({}, {
                    "name": "x",
                    "password": "y"
                });
            }
            catch (err) {
                failed = true;
                strictEqual(err instanceof Error, true);
                strictEqual(err.message, "Missing Authorization header");
            }

            strictEqual(failed, true);

        }).timeout(MAX_TIMEOUT);

        it("should reject invalid authorization header", async () => {

            let failed = false;

            try {
                await mediator.createUser({
                    "headers": {
                        "authorization": "Basic nope"
                    }
                }, {
                    "name": "x",
                    "password": "y"
                });
            }
            catch (err) {
                failed = true;
                strictEqual(err instanceof Error, true);
                strictEqual(err.message, "Invalid Authorization header");
            }

            strictEqual(failed, true);

        }).timeout(MAX_TIMEOUT);

        it("should reject invalid token", async () => {

            let failed = false;

            try {
                await mediator.createUser(authHeaders("tok-unknown"), {
                    "name": "x",
                    "password": "y"
                });
            }
            catch (err) {
                failed = true;
                strictEqual(err instanceof Error, true);
                strictEqual(err.message, "Invalid token");
            }

            strictEqual(failed, true);

        }).timeout(MAX_TIMEOUT);

        it("should accept authorization from header alias and array value", async () => {

            const user = await mediator.createUser({
                "header": {
                    "Authorization": [ "Bearer tok-admin" ]
                }
            }, {
                "name": "dave",
                "password": "secret"
            });

            strictEqual(user.name, "dave");

        }).timeout(MAX_TIMEOUT);

    });

    describe("edge cases", () => {

        it("should fail when the mediator is not initialized", async () => {

            const current = mediator;
            mediator = null;
            await current._releaseWorkSpace();

            let failed = false;

            try {
                await current.getPlugins();
            }
            catch (err) {
                failed = true;
                strictEqual(err.message, "Mediator is not initialized");
            }

            strictEqual(failed, true);

        }).timeout(MAX_TIMEOUT);

    });

});
