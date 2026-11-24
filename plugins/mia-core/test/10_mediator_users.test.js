// deps

    // natives
    const { join } = require("node:path");
    const { mkdtemp, readFile } = require("node:fs/promises");
    const { tmpdir } = require("node:os");
    const { strictEqual, deepStrictEqual, rejects } = require("node:assert");

    // externals
    const { UnauthorizedError, NotFoundError, ConflictError } = require("node-pluginsmanager-plugin");

    // locals
    const { installStubs, createContainer, useAuthStore } = require("./helpers/mediatorHarness");
    const { createAuthStore, authHeaders } = require("./helpers/authStoreHarness");

    installStubs();

    const Mediator = require("../lib/src/Mediator.ts").default;

// consts

    const DESCRIPTOR_FILE = join(__dirname, "..", "lib", "data", "Descriptor.json");

// tests

describe("Mediator users", () => {

    let descriptor = null;
    let resourcesDir = "";
    let mediator = null;

    beforeAll(async () => {

        descriptor = JSON.parse(await readFile(DESCRIPTOR_FILE, "utf-8"));
        resourcesDir = await mkdtemp(join(tmpdir(), "mia-core-users-"));

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

    describe("getUsers / getUser", () => {

        it("should list users", async () => {

            const users = await mediator.getUsers();

            strictEqual(users.length, 3);
            strictEqual(users[0].name, "admin");
            strictEqual(typeof users[0].createdAt, "string");

        });

        it("should get a user by name", async () => {

            const user = await mediator.getUser({
                "path": {
                    "name": "alice"
                }
            });

            deepStrictEqual(user, {
                "name": "alice",
                "isAdmin": false,
                "createdAt": "2024-01-01T00:00:00.000Z"
            });

        });

        it("should fail when user is missing", async () => {

            await rejects(() => {
                return mediator.getUser({
                    "path": {
                        "name": "ghost"
                    }
                });
            }, NotFoundError);

        });

    });

    describe("createUser", () => {

        it("should allow admin to create a user", async () => {

            const user = await mediator.createUser(authHeaders("tok-admin"), {
                "name": "carol",
                "password": "secret",
                "isAdmin": false
            });

            strictEqual(user.name, "carol");
            strictEqual(user.isAdmin, false);

        });

        it("should emit user.added after a successful create", async () => {

            const events = [];

            mediator.on("user.added", (user) => {
                events.push(user);
            });

            const user = await mediator.createUser(authHeaders("tok-admin"), {
                "name": "carol",
                "password": "secret",
                "isAdmin": true
            });

            strictEqual(events.length, 1);
            deepStrictEqual(events[0], user);
            strictEqual(user.isAdmin, true);

        });

        it("should not emit user.added when create conflicts", async () => {

            const events = [];

            mediator.on("user.added", (user) => {
                events.push(user);
            });

            await rejects(() => {
                return mediator.createUser(authHeaders("tok-admin"), {
                    "name": "alice",
                    "password": "secret"
                });
            }, ConflictError);

            strictEqual(events.length, 0);

        });

        it("should forbid non-admin create", async () => {

            await rejects(() => {
                return mediator.createUser(authHeaders("tok-alice"), {
                    "name": "carol",
                    "password": "secret"
                });
            }, UnauthorizedError);

        });

        it("should conflict when user already exists", async () => {

            await rejects(() => {
                return mediator.createUser(authHeaders("tok-admin"), {
                    "name": "alice",
                    "password": "secret"
                });
            }, ConflictError);

        });

    });

    describe("updateUser", () => {

        it("should allow self to update password", async () => {

            const user = await mediator.updateUser({
                ...authHeaders("tok-alice"),
                "path": {
                    "name": "alice"
                }
            }, {
                "password": "new-pass"
            });

            strictEqual(user.name, "alice");

        });

        it("should return the user unchanged when there is nothing to update", async () => {

            const user = await mediator.updateUser({
                ...authHeaders("tok-alice"),
                "path": {
                    "name": "alice"
                }
            }, {});

            deepStrictEqual(user, {
                "name": "alice",
                "isAdmin": false,
                "createdAt": "2024-01-01T00:00:00.000Z"
            });

        });

        it("should allow admin to update another user", async () => {

            const user = await mediator.updateUser({
                ...authHeaders("tok-admin"),
                "path": {
                    "name": "bob"
                }
            }, {
                "isAdmin": true
            });

            strictEqual(user.isAdmin, true);

        });

        it("should forbid editing another user when not admin", async () => {

            await rejects(() => {
                return mediator.updateUser({
                    ...authHeaders("tok-alice"),
                    "path": {
                        "name": "bob"
                    }
                }, {
                    "password": "x"
                });
            }, UnauthorizedError);

        });

        it("should forbid non-admin from changing isAdmin", async () => {

            await rejects(() => {
                return mediator.updateUser({
                    ...authHeaders("tok-alice"),
                    "path": {
                        "name": "alice"
                    }
                }, {
                    "isAdmin": true
                });
            }, UnauthorizedError);

        });

        it("should fail when target user is missing", async () => {

            await rejects(() => {
                return mediator.updateUser({
                    ...authHeaders("tok-admin"),
                    "path": {
                        "name": "ghost"
                    }
                }, {
                    "password": "x"
                });
            }, NotFoundError);

        });

        it("should forbid removing the last admin", async () => {

            await rejects(() => {
                return mediator.updateUser({
                    ...authHeaders("tok-admin"),
                    "path": {
                        "name": "admin"
                    }
                }, {
                    "isAdmin": false
                });
            }, ConflictError);

            const user = await mediator.getUser({
                "path": {
                    "name": "admin"
                }
            });

            strictEqual(user.isAdmin, true);

        });

        it("should allow demoting an admin when another admin remains", async () => {

            await mediator.updateUser({
                ...authHeaders("tok-admin"),
                "path": {
                    "name": "alice"
                }
            }, {
                "isAdmin": true
            });

            const user = await mediator.updateUser({
                ...authHeaders("tok-admin"),
                "path": {
                    "name": "admin"
                }
            }, {
                "isAdmin": false
            });

            strictEqual(user.isAdmin, false);

        });

    });

    describe("deleteUser", () => {

        it("should allow self delete", async () => {

            await mediator.deleteUser({
                ...authHeaders("tok-bob"),
                "path": {
                    "name": "bob"
                }
            });

            await rejects(() => {
                return mediator.getUser({
                    "path": {
                        "name": "bob"
                    }
                });
            }, NotFoundError);

        });

        it("should allow admin to delete another user", async () => {

            await mediator.deleteUser({
                ...authHeaders("tok-admin"),
                "path": {
                    "name": "bob"
                }
            });

            await rejects(() => {
                return mediator.getUser({
                    "path": {
                        "name": "bob"
                    }
                });
            }, NotFoundError);

        });

        it("should emit user.removed after a successful delete", async () => {

            const events = [];

            mediator.on("user.removed", (user) => {
                events.push(user);
            });

            await mediator.deleteUser({
                ...authHeaders("tok-bob"),
                "path": {
                    "name": "bob"
                }
            });

            strictEqual(events.length, 1);
            strictEqual(events[0].name, "bob");
            strictEqual(events[0].isAdmin, false);
            strictEqual(events[0].createdAt, "2024-01-01T00:00:00.000Z");

        });

        it("should not emit user.removed when delete is forbidden", async () => {

            const events = [];

            mediator.on("user.removed", (user) => {
                events.push(user);
            });

            await rejects(() => {
                return mediator.deleteUser({
                    ...authHeaders("tok-alice"),
                    "path": {
                        "name": "bob"
                    }
                });
            }, UnauthorizedError);

            strictEqual(events.length, 0);

        });

        it("should forbid deleting another user when not admin", async () => {

            await rejects(() => {
                return mediator.deleteUser({
                    ...authHeaders("tok-alice"),
                    "path": {
                        "name": "bob"
                    }
                });
            }, UnauthorizedError);

        });

        it("should fail when deleting a missing user", async () => {

            await rejects(() => {
                return mediator.deleteUser({
                    ...authHeaders("tok-admin"),
                    "path": {
                        "name": "ghost"
                    }
                });
            }, NotFoundError);

        });

        it("should forbid deleting the last admin", async () => {

            await rejects(() => {
                return mediator.deleteUser({
                    ...authHeaders("tok-admin"),
                    "path": {
                        "name": "admin"
                    }
                });
            }, ConflictError);

            const user = await mediator.getUser({
                "path": {
                    "name": "admin"
                }
            });

            strictEqual(user.name, "admin");

        });

        it("should allow deleting an admin when another admin remains", async () => {

            await mediator.updateUser({
                ...authHeaders("tok-admin"),
                "path": {
                    "name": "alice"
                }
            }, {
                "isAdmin": true
            });

            await mediator.deleteUser({
                ...authHeaders("tok-admin"),
                "path": {
                    "name": "alice"
                }
            });

            await rejects(() => {
                return mediator.getUser({
                    "path": {
                        "name": "alice"
                    }
                });
            }, NotFoundError);

        });

    });

});
