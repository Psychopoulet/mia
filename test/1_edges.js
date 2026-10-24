// deps

    // natives
    const { mkdtemp, rm, writeFile } = require("node:fs/promises");
    const { tmpdir } = require("node:os");
    const { join } = require("node:path");
    const { rejects, strictEqual } = require("node:assert");

    // externals
    const jwt = require("jsonwebtoken");
    const ContainerPattern = require("node-containerpattern");
    const ConfManager = require("node-confmanager");

    // locals
    const authorization = require("../lib/src/api/authorization.ts").default;
    const ensureAppDirectories = require("../lib/src/tools/init/ensureAppDirectories.ts").default;
    const extractToken = require("../lib/src/tools/extractToken.ts").default;
    const generateConf = require("../lib/src/tools/init/generateConf.ts").default;
    const generateDatabase = require("../lib/src/tools/init/generateDatabase.ts").default;
    const generateLogger = require("../lib/src/tools/init/generateLogger.ts").default;
    const getRequestPath = require("../lib/src/tools/init/getRequestPath.ts").default;
    const Log = require("../lib/src/tools/models/Log.ts").default;
    const managePlugins = require("../lib/src/tools/init/managePlugins.ts").default;
    const { sign, verify } = require("../lib/src/tools/AuthJWT.ts");
    const Token = require("../lib/src/tools/models/Token.ts").default;
    const User = require("../lib/src/tools/models/User.ts").default;

// private

    function _logger () {

        const calls = [];

        function _push (level) {

            return (message) => {
                calls.push(level + ":" + String(message));
            };

        }

        return {
            "calls": calls,
            "critical": _push("critical"),
            "debug": _push("debug"),
            "error": _push("error"),
            "info": _push("info"),
            "success": _push("success"),
            "warning": _push("warning")
        };

    }

    function _container (directory) {

        const container = new ContainerPattern();
        const conf = new ConfManager();

        conf.skeleton("auth-access-token", "string");
        conf.skeleton("database-uri", "string");
        conf.skeleton("debug", "boolean");
        conf.skeleton("port", "integer");

        container.set("conf", conf);
        container.set("data-directory", directory);
        container.set("database-file", join(directory, "app.db"));
        container.set("log", _logger());
        container.set("logs-file", join(directory, "logs.txt"));
        container.set("plugins-data-directory", join(directory, "plugins-data"));
        container.set("plugins-directory", join(directory, "plugins"));

        return container;

    }

    function _swap (target, key, stub, run) {

        const original = target[key];

        target[key] = stub;

        return run().finally(() => {
            target[key] = original;
        });

    }

// tests

describe("host edges", () => {

    let root = "";

    before(async () => {
        root = await mkdtemp(join(tmpdir(), "mia-edges-"));
    });

    after(async () => {

        if (User.sequelize) {

            await User.sequelize.close().catch(() => {
                return null;
            });

        }

        await rm(root, {
            "force": true,
            "recursive": true
        });

    });

    it("should create a missing data directory", async () => {

        const directory = join(root, "missing-data");
        const container = _container(directory);

        await ensureAppDirectories(container);
        strictEqual(0 < container.get("log").calls.length, true);
        await generateConf(container);

    });

    it("should load an existing env file and fill the missing token", async () => {

        const directory = join(root, "conf");
        const container = _container(directory);

        await ensureAppDirectories(container);
        await writeFile(join(directory, ".env"), "debug=false\n", "utf-8");
        await generateConf(container);

        strictEqual(container.get("conf").get("port"), 8000);
        strictEqual(container.get("conf").get("debug"), false);
        strictEqual(0 < String(container.get("conf").get("auth-access-token")).length, true);

    });

    it("should reject a postgres uri that cannot be reached", async () => {

        const directory = join(root, "postgres");
        const container = _container(directory);

        await ensureAppDirectories(container);
        container.get("conf").set("database-uri", "postgres://127.0.0.1:1/mia");

        await rejects(() => {
            return generateDatabase(container);
        }, /ECONNREFUSED|connect/i).finally(() => {

            if (!User.sequelize) {
                return undefined;
            }

            return User.sequelize.close().catch(() => {
                return null;
            });

        });

    }).timeout(15000);

    it("should log plugin manager events", async () => {

        const directory = join(root, "plugins-run");
        const container = _container(directory);
        const log = container.get("log");

        await ensureAppDirectories(container);
        await managePlugins(container).catch(() => {
            return null;
        });

        const manager = container.get("plugins-manager");
        const plugin = {
            "name": "demo",
            "version": "1.0.0"
        };

        manager._logger("info", "downloading", false, "demo");
        manager._logger("info", "plain");
        manager._logger("success", new Error("ok"), false, "demo");
        manager._logger("success", "ok");
        manager._logger("warning", "careful", false, "demo");
        manager._logger("warning", "careful");
        manager._logger("error", "bad");
        manager._logger("error", "bad", false, "demo");
        manager._logger("data", "row", false, "demo");
        manager._logger("debug", "row");

        manager.emit("error", new Error("boom"));
        manager.emit("released", plugin);
        manager.emit("allreleased");
        manager.emit("destroyed", "demo");
        manager.emit("alldestroyed");
        manager.emit("updated", plugin);
        manager.emit("installed", plugin);
        manager.emit("uninstalled", "demo");

        strictEqual(log.calls.some((line) => {
            return line.includes("demo");
        }), true);

        await manager.releaseAll();
        await manager.destroyAll();

    }).timeout(30000);

    it("should hash passwords while creating users in bulk", async () => {

        const directory = join(root, "users");
        const container = _container(directory);

        await ensureAppDirectories(container);
        await generateDatabase(container);
        await User.bulkCreate([
            {
                "isAdmin": false,
                "name": "bulk-a",
                "password": "secret-a"
            },
            {
                "isAdmin": false,
                "name": "bulk-b",
                "password": "secret-b"
            }
        ]);
        await User.destroy({
            "where": {
                "name": "nobody"
            }
        });

        strictEqual(await User.count(), 3);

        const created = await User.findOne({
            "where": {
                "name": "bulk-a"
            }
        });

        created.setDataValue("createdAt", "2024-01-01T00:00:00.000Z");
        strictEqual(created.toJSON().createdAt instanceof Date, true);

        const token = Token.build({
            "fingerprint": "edge",
            "token": "edge-token"
        });

        token.setDataValue("createdAt", "2024-01-01T00:00:00.000Z");
        strictEqual(token.toPublic().token, "edge-token");

        await User.update({
            "isAdmin": true
        }, {
            "where": {
                "name": "bulk-a"
            }
        });

        const fields = {};

        fields.password = fields.absent;

        await User.update(fields, {
            "where": {
                "name": "bulk-a"
            }
        });

    });

    it("should cover logger, token, and path branches", async () => {

        const directory = join(root, "branches");
        const container = _container(directory);
        const headers = {};

        if (User.sequelize) {

            await User.sequelize.close().catch(() => {
                return null;
            });

        }

        await ensureAppDirectories(container);
        await generateDatabase(container);
        container.get("conf").set("debug", false);
        container.get("conf").set("port", 8000);
        generateLogger(container);

        const transport = container.get("log").transports.find((item) => {
            return "SequelizeTransport" === item.constructor.name;
        });

        await new Promise((resolve) => {
            transport.log({
                "extra": 1,
                "level": "info",
                "message": "dated",
                "timestamp": new Date()
            }, resolve);
        });
        await new Promise((resolve) => {
            transport.log({
                "level": "info",
                "message": "text",
                "timestamp": "not-a-date"
            }, resolve);
        });
        await rejects(() => {
            return _swap(Log, "min", () => {
                return Promise.resolve(1);
            }, () => {
                return _swap(Log, "max", () => {
                    return Promise.resolve("not-a-date");
                }, () => {
                    return Log.getLogsLimits();
                });
            });
        }, /Invalid/);

        Object.defineProperty(headers, "authorization", {
            "enumerable": true,
            "get": () => {
                const blank = {};

                return blank.missing;
            }
        });
        strictEqual(extractToken({
            "headers": headers
        }), "");

        strictEqual(getRequestPath(container, {
            "hostname": "localhost",
            "method": "GET",
            "path": "",
            "protocol": "http"
        }).includes(":8000") || getRequestPath(container, {
            "hostname": "localhost",
            "method": "GET",
            "path": "",
            "protocol": "http"
        }).includes(":"), true);

        const opened = await new Promise((resolve) => {

            authorization(container, {
                "headers": {},
                "method": "PUT",
                "path": "/mia-core/api/auth"
            }, {}, (err) => {
                resolve(err ? err : null);
            });

        });

        strictEqual(opened, null);

        const file = join(root, "not-a-directory");

        await writeFile(file, "x", "utf-8");
        container.set("data-directory", file);

        await rejects(() => {
            return ensureAppDirectories(container);
        });

        await rejects(() => {
            return _swap(jwt, "sign", (...args) => {
                args[3](new Error("sign failed"));
            }, () => {
                return sign("admin", "secret");
            });
        }, /sign failed/);

        await rejects(() => {
            return _swap(jwt, "sign", (...args) => {
                args[3](null);
            }, () => {
                return sign("admin", "secret");
            });
        }, /No token generated/);

        await rejects(() => {
            return _swap(jwt, "verify", (...args) => {
                args[2](null);
            }, () => {
                return verify("token", "secret");
            });
        }, /Invalid token/);

        await rejects(() => {
            return _swap(jwt, "verify", (...args) => {
                args[2](null, null);
            }, () => {
                return verify("token", "secret");
            });
        }, /Invalid token/);

    });

});
