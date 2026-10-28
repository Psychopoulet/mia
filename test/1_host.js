// deps

    // natives
    const { mkdtemp, rm } = require("node:fs/promises");
    const { tmpdir } = require("node:os");
    const { join } = require("node:path");
    const { rejects, strictEqual } = require("node:assert");

    // externals
    const jwt = require("jsonwebtoken");
    const ContainerPattern = require("node-containerpattern");
    const ConfManager = require("node-confmanager");

    // locals
    const extractToken = require("../lib/src/tools/extractToken.ts").default;
    const { sign, verify } = require("../lib/src/tools/AuthJWT.ts");
    const authorization = require("../lib/src/api/authorization.ts").default;
    const generateDatabase = require("../lib/src/tools/init/generateDatabase.ts").default;
    const Log = require("../lib/src/tools/models/Log.ts").default;
    const Token = require("../lib/src/tools/models/Token.ts").default;
    const User = require("../lib/src/tools/models/User.ts").default;

// private

    function _logger () {

        function noop () {
            // ignore log output
        }

        return {
            "critical": noop,
            "debug": noop,
            "error": noop,
            "info": noop,
            "success": noop,
            "warning": noop
        };

    }

    function _container (directory) {

        const container = new ContainerPattern();
        const conf = new ConfManager();

        conf.skeleton("auth-access-token", "string");
        conf.skeleton("database-uri", "string");
        conf.set("auth-access-token", "test-secret");

        container.set("conf", conf);
        container.set("data-directory", directory);
        container.set("database-file", join(directory, "app.db"));
        container.set("log", _logger());
        container.set("logs-file", join(directory, "logs.txt"));

        return container;

    }

    function _authorize (container, req) {

        return new Promise((resolve) => {

            authorization(container, req, {}, (err) => {
                resolve(err ? err : null);
            });

        });

    }

// tests

describe("host helpers", () => {

    let root = "";
    let container = null;

    before(async () => {

        root = await mkdtemp(join(tmpdir(), "mia-host-"));
        container = _container(root);
        await generateDatabase(container);

    });

    after(async () => {

        if (User.sequelize) {

            await User.sequelize.close().catch(() => {
                return undefined;
            });

        }

        if (root) {
            await rm(root, {
                "force": true,
                "recursive": true
            });
        }

    });

    it("should read bearer tokens from request headers", () => {

        strictEqual(extractToken({
            "headers": {}
        }), "");
        strictEqual(extractToken({
            "headers": {
                "Authorization": "Bearer abc"
            }
        }), "abc");
        strictEqual(extractToken({
            "headers": {
                "authorization": [ "Bearer xyz" ]
            }
        }), "xyz");

    });

    it("should sign and verify a token", async () => {

        const token = await sign("admin", "test-secret");

        strictEqual((await verify(token, "test-secret")).name, "admin");

    });

    it("should reject invalid tokens", async () => {

        await rejects(() => {
            return verify("not-a-token", "test-secret");
        }, /jwt malformed/);

        await rejects(() => {
            return verify(jwt.sign({
                "name": "   "
            }, "test-secret"), "test-secret");
        }, /Invalid token/);

        await rejects(() => {
            return verify(jwt.sign({
                "name": 4
            }, "test-secret"), "test-secret");
        }, /Invalid token/);

        await rejects(() => {
            return verify(jwt.sign("plain", "test-secret"), "test-secret");
        }, /Invalid token/);

    });

    it("should accept the admin password and reject the others", async () => {

        strictEqual(Boolean(await User.getByNameAndPassword("admin", "admin")), true);
        strictEqual(await User.getByNameAndPassword("admin", "nope"), undefined);
        strictEqual(await User.getByNameAndPassword("missing", "admin"), undefined);

    });

    it("should hash, update, and delete users with their tokens", async () => {

        const admin = await User.scope("withPassword").findOne({
            "where": {
                "name": "admin"
            }
        });

        await admin.update({
            "isAdmin": true
        });

        const bob = await User.create({
            "isAdmin": false,
            "name": "bob",
            "password": admin.password
        });

        strictEqual((await bob.reload()).name, "bob");
        await bob.update({
            "password": "changed"
        });
        await User.update({
            "password": "bulk"
        }, {
            "where": {
                "name": "bob"
            }
        });

        const signed = await sign("bob", "test-secret");

        await Token.create({
            "fingerprint": "agent",
            "idUser": bob.id,
            "token": signed
        });

        strictEqual((await Token.getUserByToken(signed)).name, "bob");
        strictEqual((await Token.getByUserName("bob")).length, 1);
        strictEqual(await Token.getUserByToken("missing"), undefined);
        strictEqual((await Token.getByUserName("missing")).length, 0);
        strictEqual("string" === typeof bob.toJSON().createdAt.toISOString(), true);

        await bob.destroy();
        await User.destroy({
            "where": {
                "name": "admin"
            }
        });

    });

    it("should query and bound logs", async () => {

        const from = new Date("2024-01-01T00:00:00.000Z");
        const to = new Date("2024-12-31T00:00:00.000Z");

        await rejects(() => {
            return Log.getLogsLimits();
        }, /No logs found/);

        await Log.create({
            "level": "info",
            "message": "hello",
            "timestamp": new Date("2024-03-01T00:00:00.000Z")
        });

        strictEqual(await Log.countInRange(from, to), 1);
        strictEqual(await Log.countInRange(from, to, "info"), 1);
        strictEqual((await Log.findInRange(from, to)).length, 1);
        strictEqual((await Log.findInRange(from, to, "info", 1)).length, 1);
        strictEqual((await Log.findInRange(from, to, "", 0)).length, 1);
        strictEqual((await Log.getLogsLimits()).oldest.toISOString(), "2024-03-01T00:00:00.000Z");
        strictEqual(await Log.destroyInRange(from, to), 1);

    });

    it("should allow public routes and check bearer tokens", async () => {

        const publicError = await _authorize(container, {
            "headers": {},
            "method": "GET",
            "path": "/"
        });
        const openError = await _authorize(container, {
            "headers": {},
            "method": "GET",
            "path": "/mia-core/public/index.html"
        });
        const missing = await _authorize(container, {
            "headers": {},
            "method": "GET",
            "path": "/mia-core/api/users"
        });

        strictEqual(publicError, null);
        strictEqual(openError, null);
        strictEqual(missing instanceof Error, true);

        const token = await sign("admin", "test-secret");
        const unknown = await _authorize(container, {
            "headers": {
                "authorization": "Bearer " + token
            },
            "method": "GET",
            "path": "/mia-core/api/users"
        });

        strictEqual(unknown instanceof Error, true);

        await User.create({
            "isAdmin": true,
            "name": "admin",
            "password": "admin"
        });

        const row = await User.findOne({
            "where": {
                "name": "admin"
            }
        });

        await Token.create({
            "fingerprint": "agent",
            "idUser": row.id,
            "token": token
        });

        const allowed = await _authorize(container, {
            "headers": {
                "authorization": "Bearer " + token
            },
            "method": "GET",
            "path": "/mia-core/api/users"
        });
        const expiredToken = jwt.sign({
            "name": "admin"
        }, "test-secret", {
            "expiresIn": -1
        });

        await Token.create({
            "fingerprint": "agent",
            "idUser": row.id,
            "token": expiredToken
        });

        const expired = await _authorize(container, {
            "headers": {
                "authorization": "Bearer " + expiredToken
            },
            "method": "GET",
            "path": "/mia-core/api/users"
        });

        strictEqual(allowed, null);
        strictEqual(expired instanceof Error, true);

    });

    it("should open a sqlite uri and reject an unsupported dialect", async () => {

        const uriDirectory = await mkdtemp(join(tmpdir(), "mia-uri-"));
        const uriContainer = _container(uriDirectory);
        const storage = join(uriDirectory, "uri.db");

        const previous = User.sequelize;

        if (previous) {
            await previous.close();
        }

        uriContainer.get("conf").set("database-uri", "sqlite:" + storage);

        await generateDatabase(uriContainer);
        strictEqual(await User.count(), 1);

        const sqliteUri = User.sequelize;

        uriContainer.get("conf").set("database-uri", "sqlite:///" + storage);
        await generateDatabase(uriContainer);

        if (sqliteUri && sqliteUri !== User.sequelize) {
            await sqliteUri.close();
        }

        strictEqual(await User.count(), 1);

        const second = User.sequelize;

        uriContainer.get("conf").set("database-uri", "   ");
        await generateDatabase(uriContainer);

        if (second && second !== User.sequelize) {
            await second.close();
        }

        uriContainer.get("conf").set("database-uri", "mysql://localhost/mia");

        await rejects(() => {

            return Promise.resolve().then(() => {
                return generateDatabase(uriContainer);
            });

        }, /Unsupported database dialect/);

        if (User.sequelize) {
            await User.sequelize.close();
        }

        await rm(uriDirectory, {
            "force": true,
            "recursive": true
        });

    });

});
